package com.ealen.service;

import com.ealen.dao.JobEntityRepository;
import com.ealen.entity.JobEntity;
import com.ealen.task.TaskInterface;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.stereotype.Component;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Component
public class JobService {

    @Autowired
    private SchedulerFactoryBean schedulerFactoryBean;

    @Autowired
    private JobEntityRepository jobEntityRepository;

    @Autowired
    private ApplicationContext ctx;

    @Autowired
    private DynamicJobService dynamicJobService;

    public Map<String,Object> schedule(JobEntity jobEntity) {
        Map<String,Object> outMap = new HashMap<String,Object>();
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:ss:mm") ;

        try {
            //如果存在记录，则更新，否则添加新记录
            JobEntity job = jobEntityRepository.findByNameAndGroup(jobEntity.getName(), jobEntity.getJobGroup()) ;

            if(job!=null){
                outMap.put("code", 0);
                outMap.put("msg", "任务已存在");
                return outMap;
            }else{
                jobEntityRepository.save(jobEntity) ;
            }
            JobDataMap map = dynamicJobService.getJobDataMap(jobEntity);
            JobKey jobKey = dynamicJobService.getJobKey(jobEntity);
            JobDetail jobDetail = dynamicJobService.getJobDetail(jobKey, jobEntity.getDescription(), map);

            CronScheduleBuilder cronScheduleBuilder = CronScheduleBuilder.cronSchedule(jobEntity.getCron());
            TriggerBuilder<CronTrigger> triggerBuilder = TriggerBuilder.newTrigger()
                    .withIdentity(jobKey.getName(), jobKey.getGroup())
                    .withSchedule(cronScheduleBuilder)
                    .usingJobData(dynamicJobService.getJobDataMap(jobEntity));
            if (jobEntity.getStartTime() != null) {
                triggerBuilder.startAt(jobEntity.getStartTime());
            }
            CronTrigger trigger = triggerBuilder.build();
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            scheduler.scheduleJob(jobDetail, trigger);
            outMap.put("code", 1);
            outMap.put("msg", "任务添加成功");
        } catch (SchedulerException e) {
            log.error("添加任务失败：", e);
            outMap.put("code", 0);
            outMap.put("msg", "任务添加失败");
        }
        return outMap;
    }


    public Map<String,Object> updateTrigger(JobEntity jobEntity) {
        Map<String,Object> outMap = new HashMap<>();

        synchronized (this) {
            try {
                JobEntity entity = dynamicJobService.getJobEntityById(jobEntity.getId());
                Scheduler scheduler = schedulerFactoryBean.getScheduler();
                if (entity != null) {
                    JobKey jobKey = dynamicJobService.getJobKey(entity);
                    scheduler.pauseTrigger(TriggerKey.triggerKey(jobKey.getName(), jobKey.getGroup()));
                    scheduler.pauseJob(jobKey);
                    scheduler.unscheduleJob(TriggerKey.triggerKey(jobKey.getName(), jobKey.getGroup()));
                    scheduler.deleteJob(jobKey);
                    jobEntityRepository.deleteById(entity.getId());
                }
                jobEntityRepository.saveAndFlush(jobEntity);
                JobKey jobKey = dynamicJobService.getJobKey(jobEntity);
                JobDataMap map = dynamicJobService.getJobDataMap(jobEntity);
                JobDetail jobDetail = dynamicJobService.getJobDetail(jobKey, jobEntity.getDescription(), map);
                CronScheduleBuilder cronScheduleBuilder = CronScheduleBuilder.cronSchedule(jobEntity.getCron());
                TriggerBuilder<CronTrigger> triggerBuilder = TriggerBuilder.newTrigger()
                        .withIdentity(jobKey.getName(), jobKey.getGroup())
                        .withSchedule(cronScheduleBuilder)
                        .usingJobData(dynamicJobService.getJobDataMap(jobEntity));
                if (jobEntity.getStartTime() != null) {
                    triggerBuilder.startAt(jobEntity.getStartTime());
                }
                CronTrigger trigger = triggerBuilder.build();
                scheduler.scheduleJob(jobDetail, trigger);
                outMap.put("code", 1);
                outMap.put("msg", "任务修改成功");
            } catch (SchedulerException e) {
                e.printStackTrace();
                outMap.put("code", 0);
                outMap.put("msg", "任务修改失败");
            }
        }
        return outMap;
    }

    public Map<String,Object> deleteTrigger(List<Map<String, Object>> triggers) {
        Map<String,Object> resultMap = new HashMap<>();
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        StringBuffer sb = new StringBuffer();
        String name;
        String group;
        for (Map<String, Object> m:triggers) {
            name = m.get("name").toString();
            group = m.get("jobGroup").toString();
            JobEntity jobEntity = findByNameAndGroup(name, group);
            if (jobEntity != null) {
                try {
                    JobKey jobKey = dynamicJobService.getJobKey(jobEntity);
                    scheduler.pauseTrigger(new TriggerKey(jobEntity.getName(), jobEntity.getJobGroup()));
                    scheduler.pauseJob(jobKey);
                    scheduler.unscheduleJob(new TriggerKey(jobEntity.getName(), jobEntity.getJobGroup()));
                    scheduler.deleteJob(jobKey);
                    jobEntityRepository.deleteById(jobEntity.getId());
                    sb.append("组：").append(group).append("，任务：").append(name).append("删除成功；");
                } catch (Exception e) {
                    sb.append("组：").append(group).append("，任务：").append(name).append("删除失败；");
                    log.error("删除定时任务失败，任务名称：{}，任务分组：{}，原因：{}", name, group, e);
                }
            }
        }
        resultMap.put("msg", sb.toString());
        return resultMap;
    }

    public Map<String,Object> pauseTrigger(List<Map<String, Object>> triggers) {
        Map<String,Object> resultMap = new HashMap<>();
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        StringBuffer sb = new StringBuffer();
        String name;
        String group;
        for (Map<String, Object> m:triggers) {
            name = m.get("name").toString();
            group = m.get("jobGroup").toString();

            try {
                scheduler.pauseTrigger(TriggerKey.triggerKey(name, group));
                sb.append("组：").append(group).append("，任务：").append(name).append("暂停成功；");
            } catch (Exception e) {
                sb.append("组：").append(group).append("，任务：").append(name).append("暂停失败；");
                log.error("暂停定时任务失败，任务名称：{}，任务分组：{}，原因：{}", name, group, e);
            }
        }
        resultMap.put("msg", sb.toString());
        return resultMap;
    }

    public Map<String,Object> resumeTrigger(List<Map<String, Object>> triggers) {
        Map<String,Object> resultMap = new HashMap<>();
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        StringBuffer sb = new StringBuffer();
        String name;
        String group;
        for (Map<String, Object> m:triggers) {
            name = m.get("name").toString();
            group = m.get("jobGroup").toString();

            try {
                scheduler.resumeTrigger(TriggerKey.triggerKey(name, group));
                sb.append("组：").append(group).append("，任务：").append(name).append("重置成功；");
            } catch (Exception e) {
                sb.append("组：").append(group).append("，任务：").append(name).append("重置失败；");
                log.error("重置定时任务失败，任务名称：{}，任务分组：{}，原因：{}", name, group, e);
            }
        }
        resultMap.put("msg", sb.toString());
        return resultMap;
    }

    public Map<String,Object> executeTrigger(JobEntity job) {
        Map<String,Object> resultMap = new HashMap<>();

        StringBuffer sb = new StringBuffer();
        try {
            TaskInterface task = (TaskInterface)ctx.getBean(job.getClassName());
            task.execute(job.getParameter(), new Date(), job.getStartTime(), job.getJobGroup(), job.getName());
            sb.append("组：").append(job.getJobGroup()).append("，任务：").append(job.getName()).append("执行成功；");
        } catch (Exception e) {
            sb.append("组：").append(job.getJobGroup()).append("，任务：").append(job.getName()).append("执行失败；");
            log.error("执行定时任务失败，任务名称：{}，任务分组：{}，原因：{}", job.getName(), job.getJobGroup(), e);
        }

        resultMap.put("msg", sb.toString());
        return resultMap;
    }

    public List findTrigger() {
        return jobEntityRepository.findTrigger() ;
    }
    //find by triggerName
    public List findTriggerByName(String name) {
        return jobEntityRepository.findTriggerByName(name) ;
    }
    //find by triggerName and group
    public List findTrigger(String name,String group) {
        return jobEntityRepository.findTrigger(name,group) ;
    }
    //find by group
    public List findTriggerByGroup(String group) {
        return jobEntityRepository.findTriggerByGroup(group) ;
    }
    //查找任务
//    public JobEntity findByMynameAndMygroup(String name, String group) {
//        return jobEntityRepository.findByNameAndGroup(name, group) ;
//    }
    //查找cron表达式
    public String findCron(String name,String group){
        return jobEntityRepository.findCron(name, group) ;
    }

    //查找任务
    public List<Object> findTriggerByParams(String name, String group) {
        return jobEntityRepository.getTriggerByParams(name, group) ;
    }

    //查找JobEntity
    public JobEntity findByNameAndGroup(String name, String jobGroup) {
        JobEntity jobEntity = jobEntityRepository.findByNameAndGroup(name, jobGroup);
        return jobEntity;
    }
}
