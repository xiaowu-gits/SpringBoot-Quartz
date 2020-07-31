package com.ealen.web;

import com.ealen.dao.JobEntityRepository;
import com.ealen.entity.JobEntity;
import com.ealen.service.DynamicJobService;
import com.ealen.service.JobService;
import com.ealen.util.QuartzUtils;
import com.ealen.web.dto.ModifyCronDTO;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.quartz.impl.matchers.GroupMatcher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
import javax.validation.constraints.NotNull;
import java.math.BigInteger;
import java.util.*;

/**
 * Created by EalenXie on 2018/6/4 16:12
 */
@Controller
@Slf4j
@RequestMapping("/index")
public class JobController {

    @Autowired
    private SchedulerFactoryBean schedulerFactoryBean;

    @Autowired
    private DynamicJobService dynamicJobService;

    @Autowired
    private JobEntityRepository repository;

    @Autowired
    private JobService jobService;

    @Autowired
    private QuartzUtils quartzUtils;

    //初始化启动所有的Job
    @PostConstruct
    public void initialize() {
        try {
            reStartAllJobs();
            log.info("init success");
        } catch (SchedulerException e) {
            log.error("printStackTrace ", e);
        }
    }

    @RequestMapping(value="/quartz")
    public String quartzIndex(){
        return "index/index";
    }

    @RequestMapping(value = "/getAllTriggers", method = RequestMethod.POST)
    @ResponseBody
    public Object getAllUser(@RequestParam String name, @RequestParam String group)
    {
        List<Map<String,Object>> resultObjList =new ArrayList<Map<String,Object>>();
        List resultList =new ArrayList();
        try {
            resultList = jobService.findTriggerByParams(name, group);

            //转格式
            for(Object obj:resultList){
                Object[] dataObj = (Object[])obj;
                Map<String,Object> data = new HashMap<String,Object>();
                data.put("name", dataObj[1]);
                data.put("jobGroup", dataObj[2]);
                data.put("nextime", quartzUtils.convertBigIntegerToDateStr((BigInteger)dataObj[6]));
                data.put("preTime", quartzUtils.convertBigIntegerToDateStr((BigInteger)dataObj[7]));
                data.put("status",  quartzUtils.convertState((String)dataObj[9]));
                resultObjList.add(data);
            }
        } catch (Exception e) {
            log.error("查询失败:", e);
        }
        return resultObjList;
    }

    /**
     * 添加任务
     * @param jobEntity
     * @return
     */
    @PostMapping(value="/addTrigger")
    @ResponseBody
    public Map<String,Object> addTrigger(@RequestBody JobEntity jobEntity){
        return jobService.schedule(jobEntity);
    }

    /**
     * 修改任务
     * @param jobEntity
     * @return
     */
    @PostMapping(value="/updateTrigger")
    @ResponseBody
    public Map<String,Object> updateTrigger(@RequestBody JobEntity jobEntity){
        return jobService.updateTrigger(jobEntity);
    }

    /**
     * 删除任务
     * @param triggers
     * @return
     */
    @PostMapping(value="/deleteTrigger")
    @ResponseBody
    public Map<String,Object> deleteTrigger(@RequestBody List<Map<String, Object>> triggers){
        return jobService.deleteTrigger(triggers);
    }

    /**
     * 暂停任务
     * @param triggers
     * @return
     */
    @PostMapping(value="/pauseTrigger")
    @ResponseBody
    public Map<String,Object> pauseTrigger(@RequestBody List<Map<String, Object>> triggers){
        return jobService.pauseTrigger(triggers);
    }

    /**
     * 重置任务
     * @param triggers
     * @return
     */
    @PostMapping(value="/resumeTrigger")
    @ResponseBody
    public Map<String,Object> resumeTrigger(@RequestBody List<Map<String, Object>> triggers){
        return jobService.resumeTrigger(triggers);
    }

    /**
     * 立即执行任务
     * @param jobEntity
     * @return
     */
    @PostMapping(value="/executeTrigger")
    @ResponseBody
    public Map<String,Object> executeTrigger(@RequestBody JobEntity jobEntity){
        return jobService.executeTrigger(jobEntity);
    }

    /**
     * 根据任务名称和任务分组查找JobEntity
     * @param name
     * @param group
     * @return
     */
    @RequestMapping(value = "/getJobEntity", method = RequestMethod.POST)
    @ResponseBody
    public Map<String,Object> getJobEntity(@RequestParam String name, @RequestParam String group){
        Map<String,Object> outMap = new HashMap<>();
        JobEntity jobEntity = jobService.findByNameAndGroup(name, group);
        if (jobEntity == null) {
            outMap.put("code", 0);
            outMap.put("msg", "未查到相关任务");
        } else {
            outMap.put("code", 1);
            outMap.put("msg", "");
            outMap.put("data", jobEntity);
        }
        return outMap;
    }

    //根据ID重启某个Job
    @RequestMapping("/refresh/{id}")
    public String refresh(@PathVariable @NotNull Long id) throws SchedulerException {
        String result;
        JobEntity entity = dynamicJobService.getJobEntityById(id);
        if (Objects.isNull(entity)) return "error: id is not exist ";
        synchronized (log) {
            JobKey jobKey = dynamicJobService.getJobKey(entity);
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            scheduler.pauseJob(jobKey);
            scheduler.unscheduleJob(TriggerKey.triggerKey(jobKey.getName(), jobKey.getGroup()));
            scheduler.deleteJob(jobKey);
            JobDataMap map = dynamicJobService.getJobDataMap(entity);
            JobDetail jobDetail = dynamicJobService.getJobDetail(jobKey, entity.getDescription(), map);
            if (entity.getStatus().equals("OPEN")) {
                scheduler.scheduleJob(jobDetail, dynamicJobService.getTrigger(entity));
                result = "Refresh Job : " + entity.getName() + "\t jarPath: " + entity.getJarPath() + " success !";
            } else {
                result = "Refresh Job : " + entity.getName() + "\t jarPath: " + entity.getJarPath() + " failed ! , " +
                        "Because the Job status is " + entity.getStatus();
            }
        }
        return result;
    }


    //重启数据库中所有的Job
    @RequestMapping("/refresh/all")
    public String refreshAll() {
        String result;
        try {
            reStartAllJobs();
            result = "success";
        } catch (SchedulerException e) {
            result = "exception : " + e.getMessage();
        }
        return "refresh all jobs : " + result;
    }

    /**
     * 重新启动所有的job
     */
    private void reStartAllJobs() throws SchedulerException {
        synchronized (log) {                                                         //只允许一个线程进入操作
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            Set<JobKey> set = scheduler.getJobKeys(GroupMatcher.anyGroup());
            scheduler.pauseJobs(GroupMatcher.anyGroup());                               //暂停所有JOB
            for (JobKey jobKey : set) {                                                 //删除从数据库中注册的所有JOB
                scheduler.unscheduleJob(TriggerKey.triggerKey(jobKey.getName(), jobKey.getGroup()));
                scheduler.deleteJob(jobKey);
            }
            for (JobEntity job : dynamicJobService.loadJobs()) {                               //从数据库中注册的所有JOB
                log.info("Job register name : {} , group : {} , cron : {}", job.getName(), job.getJobGroup(), job.getCron());
                JobDataMap map = dynamicJobService.getJobDataMap(job);
                JobKey jobKey = dynamicJobService.getJobKey(job);
                JobDetail jobDetail = dynamicJobService.getJobDetail(jobKey, job.getDescription(), map);
//                if (job.getStatus() != null && job.getStatus().equals("OPEN")) {
                    scheduler.scheduleJob(jobDetail, dynamicJobService.getTrigger(job));
//                } else {
//                    log.info("Job jump name : {} , Because {} status is {}", job.getName(), job.getName(), job.getStatus());
//                }
            }
        }
    }

    //修改某个Job执行的Cron
    @PostMapping("/modifyJob")
    public String modifyJob(@RequestBody @Validated ModifyCronDTO dto) {
        if (!CronExpression.isValidExpression(dto.getCron())) return "cron is invalid !";
        synchronized (log) {
            JobEntity job = dynamicJobService.getJobEntityById(dto.getId());
            if (job.getStatus().equals("OPEN")) {
                try {
                    JobKey jobKey = dynamicJobService.getJobKey(job);
                    TriggerKey triggerKey = new TriggerKey(jobKey.getName(), jobKey.getGroup());
                    Scheduler scheduler = schedulerFactoryBean.getScheduler();
                    CronTrigger cronTrigger = (CronTrigger) scheduler.getTrigger(triggerKey);
                    String oldCron = cronTrigger.getCronExpression();
                    if (!oldCron.equalsIgnoreCase(dto.getCron())) {
                        job.setCron(dto.getCron());
                        CronScheduleBuilder cronScheduleBuilder = CronScheduleBuilder.cronSchedule(dto.getCron());
                        CronTrigger trigger = TriggerBuilder.newTrigger()
                                .withIdentity(jobKey.getName(), jobKey.getGroup())
                                .withSchedule(cronScheduleBuilder)
                                .usingJobData(dynamicJobService.getJobDataMap(job))
                                .build();
                        scheduler.rescheduleJob(triggerKey, trigger);
                        repository.save(job);
                    }
                } catch (Exception e) {
                    log.error("printStackTrace", e);
                }
            } else {
                log.info("Job jump name : {} , Because {} status is {}", job.getName(), job.getName(), job.getStatus());
                return "modify failure , because the job is closed";
            }
        }
        return "modify success";
    }


}
